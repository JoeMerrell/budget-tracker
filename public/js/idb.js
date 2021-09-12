// db connection
let db;

// connect to IndexedDB database 
const request = indexedDB.open('budget_tracker', 1);

// if the database version changes, this event will be triggered
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store 
    db = event.target.result;
    // check if app is online
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
request.onerror = function(event) {
console.log(event.target.errorCode);
};


// submit new transaction if no connection
function saveRecord(record) {
    // open a new transaction with the database readwrite permissions  
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access objectStore 
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // add record to store with add (method)
    budgetObjectStore.add(record);
};

// function handles collecting the data 
function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // get transactions from store and set to a variable
    const getAll = budgetObjectStore.getAll();
  
    // if successful .getAll() execution, run this function
    getAll.onsuccess = function() {
      
    // if data in indexDb store, send to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open another transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          // access object store
          const budgetObjectStore = transaction.objectStore('new_transaction');
          // clear items in the store
          budgetObjectStore.clear();

          alert('All offline transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}

// listen for reconnect 'online'
window.addEventListener('online', uploadTransaction);