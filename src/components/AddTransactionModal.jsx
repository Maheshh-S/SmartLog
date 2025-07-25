import { useState, useEffect, useRef } from 'react';
import { useTransactions, useCurrency } from './TransactionContext';
import { Calendar, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const defaultCategories = [
  "Food",
  "Entertainment",
  "Utilities",
  "Transport",
  "Shopping",
  "Health",
  "Education",
  "Salary",
  "Gift",
  "Investment"
];

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function AddTransactionModal({ showModal = true, setShowModal = () => {}, darkMode = false }) {
  const { addTransaction, transactions } = useTransactions();
  const { currency, locale } = useCurrency();
  const [form, setForm] = useState({
    amount: '',
    category: '',
    type: 'Expense',
    date: formatDate(new Date()),
    note: ''
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const categoryRef = useRef(null);
  const dateRef = useRef(null);

  // Get unique categories from existing transactions
  const existingCategories = [...new Set(transactions.map(t => t.category))];
  const allCategories = [...defaultCategories, ...existingCategories.filter(c => !defaultCategories.includes(c))];
  const categories = [...new Set(allCategories)].sort();

  const getCurrencySymbol = () => {
    return (0).toLocaleString(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
  };

  useEffect(() => {
    if (showModal) {
      setIsVisible(true);
    }
  }, [showModal]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setShowCustomCategoryInput(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.amount || parseFloat(form.amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!form.category.trim()) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    addTransaction({
      ...form,
      id: Date.now(),
      amount: parseFloat(form.amount)
    });
    toast.success('Transaction Added Successfully!');
    
    setForm({
      amount: '',
      category: '',
      type: 'Expense',
      date: formatDate(new Date()),
      note: ''
    });
    setErrors({});
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowModal(false), 300);
  };

  const handleAmountChange = (value) => {
    const sanitizedValue = value
      .replace(/[^0-9.]/g, '')
      .replace(/^\./, '')
      .replace(/(\..*)\./g, '$1');
    
    setForm({ ...form, amount: sanitizedValue });
    if (errors.amount) setErrors({ ...errors, amount: '' });
  };

  const handleCategorySelect = (category) => {
    if (category === 'Other') {
      setShowCustomCategoryInput(true);
      setForm({ ...form, category: '' });
      setCustomCategory('');
    } else {
      setForm({ ...form, category });
      setShowCategoryDropdown(false);
    }
    if (errors.category) setErrors({ ...errors, category: '' });
  };

  const handleCustomCategorySave = () => {
    if (customCategory.trim()) {
      setForm({ ...form, category: customCategory });
      setShowCustomCategoryInput(false);
      setShowCategoryDropdown(false);
    }
  };

  const handleDateChange = (dateString) => {
    setForm({ ...form, date: formatDate(dateString) });
    setShowDatePicker(false);
  };

  const renderDatePicker = () => {
    const [dd, mm, yyyy] = form.date.split('/');
    const currentDate = new Date(`${yyyy}-${mm}-${dd}`);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    const daysInMonth = new Date(yyyy, mm, 0).getDate();
    const firstDayOfMonth = new Date(yyyy, mm - 1, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = i === parseInt(dd);
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateChange(`${yyyy}-${mm}-${String(i).padStart(2, '0')}`)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : darkMode 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className={`absolute top-full left-0 mt-2 w-full rounded-lg shadow-lg p-4 z-20 border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <button 
            type="button"
            onClick={() => {
              const prevMonth = new Date(currentDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              handleDateChange(prevMonth.toISOString().split('T')[0]);
            }}
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
          <div className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button 
            type="button"
            onClick={() => {
              const nextMonth = new Date(currentDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              handleDateChange(nextMonth.toISOString().split('T')[0]);
            }}
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronDown className="w-5 h-5 -rotate-90" />
          </button>
        </div>
        <div className={`grid grid-cols-7 gap-1 text-center text-xs mb-2 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
            className={`text-sm ${
              darkMode ? 'text-blue-400 hover:underline' : 'text-blue-500 hover:underline'
            }`}
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  if (!showModal) return null;

  return (
    <div 
      className={`fixed inset-0 w-full h-screen z-50 overflow-y-auto transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${darkMode ? 'dark' : ''}`}
      onClick={handleClose}
    >
      <div className={`fixed inset-0 backdrop-blur-sm transition-opacity duration-300 ${
        darkMode ? 'bg-black/30' : 'bg-black/20'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div className="flex items-center justify-center min-h-full p-4 py-8 relative">
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 my-auto ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-2xl ${
            darkMode ? 'dark:from-blue-600 dark:to-purple-600' : ''
          }`}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Transaction</h2>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  {getCurrencySymbol()}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.amount 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-700' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-red-500 dark:text-red-400 text-sm">{errors.amount}</p>}
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <div className="relative" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowCustomCategoryInput(false);
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center justify-between ${
                    errors.category 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-700' 
                      : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  {form.category || 'Select category'}
                  <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategoryDropdown && !showCustomCategoryInput && (
                  <div className={`absolute top-full left-0 mt-1 w-full rounded-lg shadow-lg py-1 z-20 border max-h-60 overflow-y-auto ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full px-4 py-2 text-left transition-colors ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('Other')}
                      className={`w-full px-4 py-2 text-left transition-colors ${
                        darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-500 hover:bg-gray-100'
                      }`}
                    >
                      Other...
                    </button>
                  </div>
                )}
                
                {showCustomCategoryInput && (
                  <div className={`absolute top-full left-0 mt-1 w-full rounded-lg shadow-lg p-3 z-20 border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className={`w-full px-3 py-2 border-b ${
                        darkMode ? 'border-blue-400 bg-transparent text-white' : 'border-blue-500 bg-transparent'
                      } focus:outline-none`}
                      placeholder="Enter custom category"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomCategorySave()}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCategoryInput(false);
                          setShowCategoryDropdown(true);
                        }}
                        className={`px-3 py-1 rounded ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCustomCategorySave}
                        disabled={!customCategory.trim()}
                        className={`px-3 py-1 rounded ${
                          darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.category && <p className="text-red-500 dark:text-red-400 text-sm">{errors.category}</p>}
            </div>

            {/* Type Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <div className={`relative h-12 rounded-lg p-1 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <div className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-md transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                  form.type === 'Income' 
                    ? 'left-1 bg-green-100 dark:bg-green-900/30 shadow-sm' 
                    : 'left-[calc(50%+0.25rem)] bg-red-100 dark:bg-red-900/30 shadow-sm'
                }`}></div>
                
                <div className="relative flex h-full">
                  {['Income', 'Expense'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`flex-1 flex items-center justify-center z-10 font-medium ${
                        form.type === type
                          ? type === 'Income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <div className="relative" ref={dateRef}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center justify-between ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    {form.date}
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>
                {showDatePicker && renderDatePicker()}
              </div>
            </div>

            {/* Note Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note (Optional)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Add a note about this transaction..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-colors ${
                  isSubmitting
                    ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed'
                    : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}