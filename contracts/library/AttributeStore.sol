pragma solidity ^0.4.21;

library AttributeStore {
    struct Data {
        mapping(bytes32 => uint) store;
    }

    function getAttribute(Data storage self, bytes32 _UUID, string _attrName) public view returns (uint) {
        bytes32 key = keccak256(abi.encodePacked(_UUID, _attrName));
        return self.store[key];
    }

    function setAttribute(Data storage self, bytes32 _UUID, string _attrName, uint _attrVal) public {
        bytes32 key = keccak256(abi.encodePacked(_UUID, _attrName));
        self.store[key] = _attrVal;
    }
}
