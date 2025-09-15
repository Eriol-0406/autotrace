// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EnhancedInventoryContract {
    // Entity registration
    struct Entity {
        string entityName;
        string role; // "Manufacturer", "Supplier", "Distributor", "Admin"
        bool isRegistered;
        bool isApproved;
        uint256 registrationDate;
    }
    
    // Transaction structure for B2B operations
    struct Transaction {
        uint256 transactionId;
        address from;
        address to;
        string partName;
        uint256 quantity;
        string transactionType; // "demand" or "supply"
        uint256 timestamp;
        bool isApproved;
        string invoice;
    }
    
    // Order structure (existing)
    struct Order {
        uint256 orderId;
        address buyer;
        address seller;
        string partName;
        uint256 quantity;
        uint256 timestamp;
        bool completed;
        string txHash;
    }

    // State variables
    mapping(address => Entity) public entities;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => Order) public orders;
    mapping(address => bool) public admins;
    
    uint256 public transactionCounter;
    uint256 public orderCounter;
    address public owner;
    
    // Events
    event EntityRegistered(address indexed wallet, string entityName, string role);
    event EntityApproved(address indexed wallet, address indexed approver);
    event TransactionCreated(uint256 indexed transactionId, address indexed from, address indexed to, string partName, uint256 quantity, string transactionType);
    event TransactionApproved(uint256 indexed transactionId, address indexed approver);
    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, string partName, uint256 quantity);
    event OrderCompleted(uint256 indexed orderId, string txHash);
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can perform this action");
        _;
    }
    
    modifier onlyRegistered() {
        require(entities[msg.sender].isRegistered, "Entity must be registered");
        _;
    }
    
    modifier onlyApproved() {
        require(entities[msg.sender].isApproved, "Entity must be approved");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // Entity Management Functions
    function registerWallet(string memory _entityName, string memory _role) external {
        require(!entities[msg.sender].isRegistered, "Entity already registered");
        require(bytes(_entityName).length > 0, "Entity name cannot be empty");
        
        entities[msg.sender] = Entity({
            entityName: _entityName,
            role: _role,
            isRegistered: true,
            isApproved: false, // Requires admin approval
            registrationDate: block.timestamp
        });
        
        emit EntityRegistered(msg.sender, _entityName, _role);
    }
    
    function approveEntity(address _entityWallet) external onlyAdmin {
        require(entities[_entityWallet].isRegistered, "Entity not registered");
        require(!entities[_entityWallet].isApproved, "Entity already approved");
        
        entities[_entityWallet].isApproved = true;
        emit EntityApproved(_entityWallet, msg.sender);
    }
    
    function addAdmin(address _admin) external onlyAdmin {
        admins[_admin] = true;
    }
    
    function removeAdmin(address _admin) external onlyAdmin {
        require(_admin != owner, "Cannot remove contract owner");
        admins[_admin] = false;
    }

    // Transaction Functions (B2B Demand/Supply)
    function createTransaction(
        address _to,
        string memory _partName,
        uint256 _quantity,
        string memory _transactionType,
        string memory _invoice
    ) external onlyRegistered onlyApproved returns (uint256) {
        require(_to != msg.sender, "Cannot create transaction to yourself");
        require(entities[_to].isRegistered && entities[_to].isApproved, "Recipient must be registered and approved");
        require(bytes(_partName).length > 0, "Part name cannot be empty");
        require(_quantity > 0, "Quantity must be greater than 0");
        
        transactionCounter++;
        
        transactions[transactionCounter] = Transaction({
            transactionId: transactionCounter,
            from: msg.sender,
            to: _to,
            partName: _partName,
            quantity: _quantity,
            transactionType: _transactionType,
            timestamp: block.timestamp,
            isApproved: false, // Requires admin approval
            invoice: _invoice
        });
        
        emit TransactionCreated(transactionCounter, msg.sender, _to, _partName, _quantity, _transactionType);
        return transactionCounter;
    }
    
    function approveTransaction(uint256 _transactionId) external onlyAdmin {
        require(transactions[_transactionId].transactionId != 0, "Transaction does not exist");
        require(!transactions[_transactionId].isApproved, "Transaction already approved");
        
        transactions[_transactionId].isApproved = true;
        emit TransactionApproved(_transactionId, msg.sender);
    }

    // Order Functions (existing functionality enhanced)
    function createOrder(
        address _seller,
        string memory _partName,
        uint256 _quantity
    ) external onlyRegistered onlyApproved returns (uint256) {
        require(_seller != msg.sender, "Cannot create order to yourself");
        require(entities[_seller].isRegistered && entities[_seller].isApproved, "Seller must be registered and approved");
        
        orderCounter++;
        
        orders[orderCounter] = Order({
            orderId: orderCounter,
            buyer: msg.sender,
            seller: _seller,
            partName: _partName,
            quantity: _quantity,
            timestamp: block.timestamp,
            completed: false,
            txHash: ""
        });
        
        emit OrderCreated(orderCounter, msg.sender, _seller, _partName, _quantity);
        return orderCounter;
    }
    
    function completeOrder(uint256 _orderId, string memory _txHash) external {
        require(orders[_orderId].orderId != 0, "Order does not exist");
        require(orders[_orderId].seller == msg.sender, "Only seller can complete order");
        require(!orders[_orderId].completed, "Order already completed");
        
        orders[_orderId].completed = true;
        orders[_orderId].txHash = _txHash;
        
        emit OrderCompleted(_orderId, _txHash);
    }

    // View Functions
    function getEntity(address _wallet) external view returns (Entity memory) {
        return entities[_wallet];
    }
    
    function getTransaction(uint256 _transactionId) external view returns (Transaction memory) {
        return transactions[_transactionId];
    }
    
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
    
    function getTransactionCount() external view returns (uint256) {
        return transactionCounter;
    }
    
    function getOrderCount() external view returns (uint256) {
        return orderCounter;
    }
    
    function isEntityRegistered(address _wallet) external view returns (bool) {
        return entities[_wallet].isRegistered;
    }
    
    function isEntityApproved(address _wallet) external view returns (bool) {
        return entities[_wallet].isApproved;
    }
    
    function isAdmin(address _wallet) external view returns (bool) {
        return admins[_wallet];
    }
}
