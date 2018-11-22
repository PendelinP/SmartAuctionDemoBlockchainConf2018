var SmartAuction = artifacts.require("SmartAuction");

module.exports = function (deployer) {
  const endTimeAfterSeconds = 3600 * 24; // one day

  deployer.deploy(SmartAuction, endTimeAfterSeconds);
};
