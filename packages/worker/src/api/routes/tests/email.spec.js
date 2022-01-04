import setup from './utilities';
import { EmailTemplatePurpose } from '../../../constants';
import { TENANT_ID } from './utilities/structures';

// mock the email system
const sendMailMock = jest.fn()
jest.mock("nodemailer")
import nodemailer from 'nodemailer';
nodemailer.createTransport.mockReturnValue({
  sendMail: sendMailMock,
  verify: jest.fn()
})

describe("/api/global/email", () => {
  let request = setup.getRequest()
  let config = setup.getConfig()

  beforeAll(async () => {
    await config.init()
  })

  afterAll(setup.afterAll)

  it("should be able to send an email (with mocking)", async () => {
    // initially configure settings
    await config.saveSmtpConfig()
    await config.saveSettingsConfig()
    const res = await request
      .post(`/api/global/email/send`)
      .send({
        email: "test@test.com",
        purpose: EmailTemplatePurpose.INVITATION,
        tenantId: TENANT_ID,
      })
      .set(config.defaultHeaders())
      .expect("Content-Type", /json/)
      .expect(200)
    expect(res.body.message).toBeDefined()
    expect(sendMailMock).toHaveBeenCalled()
    const emailCall = sendMailMock.mock.calls[0][0]
    expect(emailCall.subject).toBe("Hello!")
    expect(emailCall.html).not.toContain("Invalid Binding")
  })
})