import TestConfig from "./TestConfiguration"

let request, config

export const beforeAll = () => {
  config = new TestConfig()
  request = config.getRequest()
}

export const afterAll = async () => {
  if (config) {
    await config.end()
  }
  request = null
  config = null
}

export const getRequest = () => {
  if (!request) {
    beforeAll()
  }
  return request
}

export const getConfig = () => {
  if (!config) {
    beforeAll()
  }
  return config
}

export const emailMock = () => {
  // mock the email system
  const sendMailMock = jest.fn()
  const nodemailer = require("nodemailer")
  nodemailer.createTransport.mockReturnValue({
    sendMail: sendMailMock,
    verify: jest.fn(),
  })
  return sendMailMock
}
