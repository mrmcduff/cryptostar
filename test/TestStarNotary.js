const truffleAssert = require('truffle-assertions');
const StarNotary = artifacts.require('StarNotary');

let accounts;
let owner;
let instance;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

beforeEach(async () => {
    instance = await StarNotary.deployed();
});

it('can Create a Star', async () => {
    const tokenId = 1;
    await instance.createStar('Awesome Star!', tokenId, { from: accounts[0] })
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async () => {
    const user1 = accounts[1];
    const starId = 2;
    const starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
    const instance = await StarNotary.deployed();
    const user1 = accounts[1];
    const user2 = accounts[2];
    const starId = 3;
    const starPrice = web3.utils.toWei(".01", "ether");
    const balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    const balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, { from: user2, value: balance });
    const balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    const value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    const value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async () => {
    const instance = await StarNotary.deployed();
    const user1 = accounts[1];
    const user2 = accounts[2];
    const starId = 4;
    const starPrice = web3.utils.toWei(".01", "ether");
    const balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    await instance.buyStar(starId, { from: user2, value: balance });
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {
    const instance = await StarNotary.deployed();
    const user1 = accounts[1];
    const user2 = accounts[2];
    const starId = 5;
    const starPrice = web3.utils.toWei(".01", "ether");
    const balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, { from: user2, value: balance, gasPrice: 0 });
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    const value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

it('can add the star token name and star symbol properly', async () => {
    assert.equal(await instance.tokenName.call(), 'UStarTokens');
    assert.equal(await instance.tokenSymbol.call(), 'UST');
});

it('prevents star exchange if one of the users is not the sender', async () => {
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const tokenId1 = 6;
    const tokenId2 = 7;
    await instance.createStar('first star', tokenId1, { from: user1 });
    await instance.createStar('second star', tokenId2, { from: user2 });
    await truffleAssert.reverts(instance.exchangeStars(tokenId1, tokenId2, { from: user3 }),
        'Only an owner can exchange a star');
});

it('lets 2 users exchange stars', async () => {
    const user1 = accounts[1];
    const user2 = accounts[2];
    const tokenId1 = 8;
    const tokenId2 = 9;
    await instance.createStar('first star', tokenId1, { from: user1 });
    await instance.createStar('second star', tokenId2, { from: user2 });

    await instance.exchangeStars(tokenId1, tokenId2, { from: user1 });
    assert.equal(await instance.ownerOf.call(tokenId1), user2);
    assert.equal(await instance.ownerOf.call(tokenId2), user1);

    // Make sure that both user1 and user2 can exchange the values.
    // Reversing the order to ensure that the owner of the second passed-in value
    // (which is now user2) is also checked.
    await instance.exchangeStars(tokenId2, tokenId1, { from: user2 });
    assert.equal(await instance.ownerOf.call(tokenId1), user1);
    assert.equal(await instance.ownerOf.call(tokenId2), user2);
});

it('lets a user transfer a star', async () => {
    const user1 = accounts[1];
    const user2 = accounts[2];
    const tokenId = 10;
    await instance.createStar('a transferrable star', tokenId, { from: user1 });

    await instance.transferStar(user2, tokenId, { from: user1 });
    assert.equal(await instance.ownerOf.call(tokenId), user2);
});

it('prevents someone who is not the owner from transferring a star', async () => {
    const user1 = accounts[1];
    const user2 = accounts[2];
    const tokenId = 11;
    await instance.createStar('a transferrable star', tokenId, { from: user1 });
    await truffleAssert.reverts(instance.transferStar(user2, tokenId, { from: user2 }), 'Only the owner can transfer a star');
});

it('lookUptokenIdToStarInfo test', async () => {
    const user4 = accounts[4];
    const tokenId = 12;
    await instance.createStar('lookup', tokenId, { from: user4 });
    assert.equal(await instance.lookUptokenIdToStarInfo(tokenId), 'lookup');
});
