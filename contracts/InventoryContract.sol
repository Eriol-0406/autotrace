// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract InventoryContract {
    struct Order {
        uint256 orderId;
        address buyer;
        address seller;
        string partName;
        uint256 quantity;   
        uint256 timestamp;
        bool completed;
        bool approved;
        string txHash;
    }

    struct Entity {
        string name;
        string entityType; // "Manufacturer", "Supplier", "Distributor"
        bool isActive;
        uint256 registeredAt;
    }

    mapping(uint256 => Order) public orders;
    mapping(address => Entity) public registeredEntities;
    mapping(address => bool) public isRegistered;
    mapping(address => bool) public isAdmin;
    
    uint256 public orderCounter;
    address public contractOwner;
    
    event OrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        string partName,
        uint256 quantity,
        uint256 timestamp
    );
    
    event OrderCompleted(
        uint256 indexed orderId,
        string txHash
    );

    event OrderApproved(
        uint256 indexed orderId,
        address indexed approver
    );

    event EntityRegistered(
        address indexed wallet,
        string name,
        string entityType
    );

    event AdminAdded(
        address indexed admin
    );

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == contractOwner, "Only admin can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "Only registered entities can perform this action");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        isAdmin[msg.sender] = true;
    }

    // Entity Registration Functions
    function registerWallet(string memory _name, string memory _entityType) external {
        require(!isRegistered[msg.sender], "Wallet already registered");
        require(bytes(_name).length > 0, "Entity name cannot be empty");
        require(
            keccak256(abi.encodePacked(_entityType)) == keccak256(abi.encodePacked("Manufacturer")) ||
            keccak256(abi.encodePacked(_entityType)) == keccak256(abi.encodePacked("Supplier")) ||
            keccak256(abi.encodePacked(_entityType)) == keccak256(abi.encodePacked("Distributor")),
            "Invalid entity type"
        );

        registeredEntities[msg.sender] = Entity({
            name: _name,
            entityType: _entityType,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        isRegistered[msg.sender] = true;
        
        emit EntityRegistered(msg.sender, _name, _entityType);
    }

    function addAdmin(address _admin) external onlyAdmin {
        isAdmin[_admin] = true;
        emit AdminAdded(_admin);
    }

    function createOrder(
        address _seller,
        string memory _partName,
        uint256 _quantity
    ) external onlyRegistered returns (uint256) {
        require(isRegistered[_seller], "Seller must be registered");
        
        orderCounter++;
        
        Order memory newOrder = Order({
            orderId: orderCounter,
            buyer: msg.sender,
            seller: _seller,
            partName: _partName,
            quantity: _quantity,
            timestamp: block.timestamp,
            completed: false,
            approved: false,
            txHash: ""
        });
        
        orders[orderCounter] = newOrder;
        
        emit OrderCreated(
            orderCounter,
            msg.sender,
            _seller,
            _partName,
            _quantity,
            block.timestamp
        );
        
        return orderCounter;
    }
    
    function approveOrder(uint256 _orderId) external onlyAdmin {
        require(orders[_orderId].orderId != 0, "Order does not exist");
        require(!orders[_orderId].approved, "Order already approved");
        
        orders[_orderId].approved = true;
        
        emit OrderApproved(_orderId, msg.sender);
    }

    function completeOrder(uint256 _orderId, string memory _txHash) external {
        require(orders[_orderId].orderId != 0, "Order does not exist");
        require(orders[_orderId].seller == msg.sender, "Only seller can complete order");
        require(orders[_orderId].approved, "Order must be approved first");
        require(!orders[_orderId].completed, "Order already completed");
        
        orders[_orderId].completed = true;
        orders[_orderId].txHash = _txHash;
        
        emit OrderCompleted(_orderId, _txHash);
    }
    
    // View Functions
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
    
    function getOrderCount() external view returns (uint256) {
        return orderCounter;
    }

    function getEntity(address _wallet) external view returns (Entity memory) {
        require(isRegistered[_wallet], "Entity not registered");
        return registeredEntities[_wallet];
    }

    function isEntityRegistered(address _wallet) external view returns (bool) {
        return isRegistered[_wallet];
    }

    function isWalletAdmin(address _wallet) external view returns (bool) {
        return isAdmin[_wallet];
    }
}
