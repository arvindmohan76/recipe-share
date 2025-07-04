import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { DataView } from 'primereact/dataview';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface ShoppingListItem {
  name: string;
  amount: string;
  unit: string;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  ingredients: ShoppingListItem[];
  recipe_ids: string[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const ShoppingListManager: React.FC = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchShoppingLists();
    }
  }, [user]);

  const fetchShoppingLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setShoppingLists(data || []);
      }
    } catch (err) {
      setError('Failed to fetch shopping lists');
    } finally {
      setLoading(false);
    }
  };

  const createShoppingList = async () => {
    if (!user || !newListName.trim()) return;

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .insert([{
          user_id: user.id,
          name: newListName.trim(),
          ingredients: [],
          recipe_ids: [],
          is_completed: false
        }]);

      if (!error) {
        setNewListName('');
        setShowCreateDialog(false);
        fetchShoppingLists();
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to create shopping list');
    }
  };

  const updateShoppingList = async (listId: string, updates: Partial<ShoppingList>) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .eq('user_id', user?.id);

      if (!error) {
        fetchShoppingLists();
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to update shopping list');
    }
  };

  const deleteShoppingList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user?.id);

      if (!error) {
        fetchShoppingLists();
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to delete shopping list');
    }
  };

  const toggleItemChecked = (list: ShoppingList, itemIndex: number) => {
    const updatedIngredients = [...list.ingredients];
    updatedIngredients[itemIndex].checked = !updatedIngredients[itemIndex].checked;
    
    updateShoppingList(list.id, { 
      ingredients: updatedIngredients,
      is_completed: updatedIngredients.every(item => item.checked)
    });
  };

  const addItemToList = (list: ShoppingList, newItem: ShoppingListItem) => {
    const updatedIngredients = [...list.ingredients, newItem];
    updateShoppingList(list.id, { ingredients: updatedIngredients });
  };

  const removeItemFromList = (list: ShoppingList, itemIndex: number) => {
    const updatedIngredients = list.ingredients.filter((_, index) => index !== itemIndex);
    updateShoppingList(list.id, { 
      ingredients: updatedIngredients,
      is_completed: updatedIngredients.length > 0 ? updatedIngredients.every(item => item.checked) : false
    });
  };

  const listTemplate = (list: ShoppingList) => {
    const completedItems = list.ingredients.filter(item => item.checked).length;
    const totalItems = list.ingredients.length;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
      <Card className="mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{list.name}</h3>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                {completedItems}/{totalItems} items completed
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {list.is_completed && (
                <span className="text-green-600 text-sm font-medium">✓ Complete</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              icon="pi pi-pencil"
              className="p-button-text p-button-sm"
              onClick={() => setEditingList(list)}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-sm p-button-danger"
              onClick={() => deleteShoppingList(list.id)}
            />
          </div>
        </div>

        <div className="space-y-2">
          {list.ingredients.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 border rounded">
              <Checkbox
                checked={item.checked}
                onChange={() => toggleItemChecked(list, index)}
              />
              <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                {item.amount} {item.unit} {item.name}
              </span>
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-sm p-button-danger"
                onClick={() => removeItemFromList(list, index)}
              />
            </div>
          ))}
          
          {list.ingredients.length === 0 && (
            <p className="text-gray-500 text-center py-4">No items in this list</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <AddItemForm 
            onAddItem={(item) => addItemToList(list, item)}
          />
        </div>
      </Card>
    );
  };

  if (!user) {
    return (
      <Message severity="info" text="Please sign in to manage your shopping lists." className="w-full" />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Shopping Lists</h1>
          <p className="text-gray-600 mt-2">
            Organize your grocery shopping and meal planning
          </p>
        </div>
        <Button
          label="New List"
          icon="pi pi-plus"
          onClick={() => setShowCreateDialog(true)}
          className="p-button-success"
        />
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full" />
      )}

      {shoppingLists.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <i className="pi pi-shopping-cart text-6xl text-gray-300"></i>
            <h3 className="text-xl font-semibold text-gray-600">No Shopping Lists Yet</h3>
            <p className="text-gray-500">
              Create your first shopping list to organize your grocery shopping and meal planning.
            </p>
            <Button
              label="Create Shopping List"
              icon="pi pi-plus"
              onClick={() => setShowCreateDialog(true)}
              className="p-button-success"
            />
          </div>
        </Card>
      ) : (
        <DataView
          value={shoppingLists}
          itemTemplate={listTemplate}
          layout="list"
        />
      )}

      {/* Create List Dialog */}
      <Dialog
        header="Create New Shopping List"
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              onClick={() => setShowCreateDialog(false)}
              className="p-button-secondary"
            />
            <Button
              label="Create"
              onClick={createShoppingList}
              disabled={!newListName.trim()}
              className="p-button-success"
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 mb-2">
              List Name
            </label>
            <InputText
              id="list-name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Weekly Groceries, Meal Prep"
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

// Component for adding items to a shopping list
const AddItemForm: React.FC<{ onAddItem: (item: ShoppingListItem) => void }> = ({ onAddItem }) => {
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    onAddItem({
      name: itemName.trim(),
      amount: itemAmount.trim() || '1',
      unit: itemUnit.trim() || 'piece',
      checked: false
    });

    setItemName('');
    setItemAmount('');
    setItemUnit('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Button
        label="Add Item"
        icon="pi pi-plus"
        onClick={() => setShowForm(true)}
        className="p-button-outlined p-button-sm"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <InputText
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        placeholder="Item name"
        className="md:col-span-2"
        autoFocus
      />
      <InputText
        value={itemAmount}
        onChange={(e) => setItemAmount(e.target.value)}
        placeholder="Amount"
      />
      <div className="flex gap-2">
        <InputText
          value={itemUnit}
          onChange={(e) => setItemUnit(e.target.value)}
          placeholder="Unit"
          className="flex-1"
        />
        <Button
          type="submit"
          icon="pi pi-check"
          className="p-button-text p-button-success p-button-sm"
          disabled={!itemName.trim()}
        />
        <Button
          type="button"
          icon="pi pi-times"
          onClick={() => setShowForm(false)}
          className="p-button-secondary p-button-sm"
        />
      </div>
    </form>
  );
};

export default ShoppingListManager;