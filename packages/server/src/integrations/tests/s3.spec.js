import AWS from 'aws-sdk';
import S3Integration from '../s3';
jest.mock("aws-sdk")

class TestConfiguration {
  constructor(config = {}) {
    this.integration = new S3Integration.integration(config) 
  }
}

describe("S3 Integration", () => {
  let config 

  beforeEach(() => {
    config = new TestConfiguration()
  })

  it("calls the read method with the correct params", async () => {
    const response = await config.integration.read({ 
      bucket: "test"
    })
    expect(config.integration.client.listObjects).toHaveBeenCalledWith({
      Bucket: "test"
    })
  })
})