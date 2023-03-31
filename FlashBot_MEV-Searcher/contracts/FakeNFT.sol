// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FakeNFT is ERC721 {
    uint256 tokenId = 1;
    uint256 constant price = 0.01 ether;

    constructor()ERC721("Fake", "FK") {}

    function mint() public payable {
        require(msg.value == price, "Eth sent is not enough");
        _mint(msg.sender, tokenId);
        tokenId += 1;
    }
}
