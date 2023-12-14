// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "../node_modules/@openzeppelin/contracts/access/AccessControl.sol";

// 1000000000000000000 wei = 1 ether
contract OrderPaymentContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MIS_ADMIN_ROLE = keccak256("MIS_ADMIN_ROLE");
    address admin;

    struct Order {
        address fromFirm;
        address toFirm;
        uint256 total;
        uint256 orderId;
        bool accepted;
        bool disputed;
    }

    Order[] public orders;
    uint256 public orderIndex;

    event OrderPlaced(
        address indexed fromFirm,
        address indexed toFirm,
        uint256 total,
        uint256 orderId,
        uint256 orderIndex
    );
    event OrderAccepted(
        uint256 indexed orderIndex,
        uint256 orderId,
        Order order
    );
    event OrderProcessComplete(uint256 indexed orderIndex, uint256 orderId);
    event DisputeRaised(uint256 indexed orderIndex, uint256 orderId);
    event DisputeResolved(uint256 indexed orderIndex, uint256 orderId);
    event PaymentProcessed(
        uint256 indexed orderIndex,
        uint256 orderId,
        uint256 amount
    );
    event AcceptedOrdersRemoved();

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Must have admin role");
        _;
    }

    constructor() {
        admin = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _grantRole(ADMIN_ROLE, admin);
    }

    function placeOrderAndProcessPayment(
        address fromFirm,
        uint256 total,
        uint256 orderId
    ) external payable returns (uint256) {
        orders.push(
            Order({
                fromFirm: fromFirm,
                toFirm: msg.sender,
                total: total,
                orderId: orderId,
                accepted: false,
                disputed: false
            })
        );

        emit OrderPlaced(fromFirm, msg.sender, total, orderId, orderIndex);

        uint256 index = orderIndex;
        require(index < orders.length, "Invalid order index");
        require(
            !orders[index].accepted && !orders[index].disputed,
            "Order not accepted or already disputed"
        );

        uint256 ethAmount = orders[index].total * 1 ether;
        payable(admin).transfer(ethAmount); // transfer from toFirm to admin
        // payable(msg.sender).transfer(amount);
        emit PaymentProcessed(index, orders[index].orderId, ethAmount);
        orderIndex++;
        return orderIndex - 1;
    }

    function processAcceptedOrder(uint256 index) external payable onlyAdmin {
        require(index < orders.length, "Invalid order index");
        require(
            orders[index].toFirm != address(0),
            "Invalid recipient address"
        );
        require(orders[index].total > 0, "Invalid amount");
        payable(orders[index].toFirm).transfer(orders[index].total * 1 ether);
        orders[index].accepted = true;
        emit OrderProcessComplete(index, orders[index].orderId);
    }

    function confirmOrder(uint256 index) external {
        require(index < orders.length, "Invalid order index");
        require(!orders[index].accepted, "Order already accepted");
        require(
            msg.sender == orders[index].fromFirm ||
                hasRole(ADMIN_ROLE, msg.sender),
            "Only the receiving firm can raise a dispute"
        );

        orders[index].accepted = true;
        emit OrderAccepted(index, orders[index].orderId, orders[index]);
    }

    function raiseDispute(uint256 index) external {
        require(index < orders.length, "Invalid order index");
        require(
            msg.sender == orders[index].toFirm,
            "Only the receiving firm can raise a dispute"
        );
        require(!orders[index].disputed, "Order already disputed");

        orders[index].disputed = true;
        emit DisputeRaised(index, orders[index].orderId);
    }

    function resolveDispute(uint256 index) external onlyAdmin {
        require(index < orders.length, "Invalid order index");
        require(orders[index].disputed, "Order not disputed");

        orders[index].disputed = false;
        emit DisputeResolved(index, orders[index].orderId);
    }

    function checkAdminRole() external view returns (bool) {
        return hasRole(ADMIN_ROLE, msg.sender);
    }

    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");

        revokeRole(ADMIN_ROLE, msg.sender);

        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        _grantRole(ADMIN_ROLE, newAdmin);
        admin = newAdmin;
    }

    function removeAcceptedOrders() external onlyAdmin {
        uint256 length = orders.length;
        uint256 newLength = 0;

        // Create a new array to store non-accepted orders
        Order[] memory newOrders = new Order[](length);

        for (uint256 i = 0; i < length; i++) {
            if (!orders[i].accepted) {
                newOrders[newLength] = orders[i];
                newLength++;
            }
        }

        // Clear the existing storage array
        for (uint256 i = 0; i < length; i++) {
            delete orders[i];
        }

        // Push the non-accepted orders back into the storage array
        for (uint256 i = 0; i < newLength; i++) {
            orders.push(newOrders[i]);
        }

        // Update orderIndex
        orderIndex = newLength;

        emit AcceptedOrdersRemoved();
    }

    function getOrderByIndex(uint256 index)
        external
        view
        returns (Order memory)
    {
        require(index < orders.length, "Invalid order index");
        return orders[index];
    }

    function getOrderById(uint256 orderId)
        external
        view
        returns (Order memory)
    {
        uint256 length = orders.length;
        uint256 index;
        for (uint256 i = 0; i < length; i++) {
            if (orders[i].orderId == orderId) {
                index = i;
                break;
            }
        }
        return orders[index];
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getUserBalance(address user) public view returns (uint256) {
        require(user != address(0), "Invalid recipient address");
        return address(user).balance;
    }

    //----------------------------------
    // function sendMoney(address recipient, uint256 amount) external payable {
    //     require(recipient != address(0), "Invalid recipient address");
    //     require(amount > 0, "Invalid amount");
    //     payable(recipient).transfer(amount);
    // }

    // function sendMoneyto(
    //     address payable recipient,
    //     uint256 amount
    // ) external payable {
    //     require(recipient != address(0), "Invalid recipient address");
    //     uint256 weiAmount = amount * 1 ether;
    //     require(weiAmount > 0, "Invalid amount");
    //     require(
    //         msg.value >= weiAmount,
    //         "Insufficient funds sent with the transaction"
    //     );

    //     recipient.transfer(weiAmount);
    // }
}
