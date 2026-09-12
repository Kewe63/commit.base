const { expect } = require("chai");
const { deploymentToken } = require("../scripts/deploy");

describe("Deployment preflight (pure, no RPC)", function () {
  it("rejects unsupported local chains before any deployment", function () {
    expect(() => deploymentToken(31337, {})).to.throw("Unsupported deployment chainId");
  });
  it("requires explicit deployment confirmation", function () {
    expect(() => deploymentToken(84532, {})).to.throw("CONFIRM_DEPLOY=true");
  });
  it("requires separate mainnet opt-in", function () {
    expect(() => deploymentToken(8453, { CONFIRM_DEPLOY: "true" })).to.throw("ALLOW_MAINNET_DEPLOY=true");
  });
  it("requires a configured signing key without logging its value", function () {
    expect(() => deploymentToken(84532, { CONFIRM_DEPLOY: "true" })).to.throw("valid PRIVATE_KEY");
  });
});
