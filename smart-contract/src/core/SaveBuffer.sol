// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SaveBuffer {
    uint256 public totalYieldReceived;
    uint256 public totalInsuranceClaimed;

    address public immutable ETHERA_PROTOCOL;

    event StakingInterestReceived(address indexed from, uint256 amount);
    event InsuranceBailout(address indexed target, uint256 amount);

    modifier onlyProtocol() {
        require(
            msg.sender == ETHERA_PROTOCOL,
            "SaveBuffer: Only ETHERA Protocol can trigger"
        );
        _;
    }

    constructor(address _etheraProtocol) {
        require(_etheraProtocol != address(0), "Invalid address");
        ETHERA_PROTOCOL = _etheraProtocol;
    }

    receive() external payable {
        totalYieldReceived += msg.value;
        emit StakingInterestReceived(msg.sender, msg.value);
    }

    function triggerBailout(
        address targetVault,
        uint256 amount
    ) external onlyProtocol {
        require(
            amount <= address(this).balance,
            "SaveBuffer: Insufficient buffer"
        );

        totalInsuranceClaimed += amount;

        (bool success, ) = targetVault.call{value: amount}("");
        require(success, "SaveBuffer: Bailout transfer failed");

        emit InsuranceBailout(targetVault, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
