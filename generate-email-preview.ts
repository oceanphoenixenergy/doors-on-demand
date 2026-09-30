import { generateCustomerQuotePreviewEmail } from "./server/emailTemplates";
import fs from "fs";

const sampleData = {
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah@example.com",
  mobile: "07777123456",
  postcode: "B74 2DH",
  doorStyle: "mexicano",
  doorFinish: "prefinished",
  totalDoors: 5,
  fireDoors: 1,
  glazedDoors: 1,
  glazedStyle: "frosted",
  bathroomLocks: 1,
  handleModel: "morley",
  handleFinish: "matt-black",
  grandTotal: 1720,
  deposit: 860,
  distanceMiles: 3.2,
};

const resumeUrl = "https://doors-on-demand.replit.app/resume/abc12345-sample-token";
const result = generateCustomerQuotePreviewEmail(sampleData, resumeUrl);
fs.writeFileSync("client/public/email-preview.html", result.html);
console.log("Done");
