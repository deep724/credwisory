import assert from "node:assert/strict";
import test from "node:test";
import { lenderLogoSources, lenderTextTileLabel, officialLenderLogo } from "@/lib/lender-logo-assets";

test("uses only verified standalone marks for supported Indian banks", () => {
  assert.equal(officialLenderLogo("axis-bank", "Axis Bank"), "/lender-logos/axis-bank-mark.svg");
  assert.equal(officialLenderLogo("union-bank-of-india", "Union Bank of India"), "/lender-logos/union-bank-mark.png");
  assert.equal(officialLenderLogo("icici-bank", "ICICI Bank"), "/lender-logos/icici-mark.png");
  assert.equal(officialLenderLogo("idfc-first-bank", "IDFC FIRST Bank"), "/lender-logos/idfc-first-bank-mark.png");
  assert.equal(officialLenderLogo("punjab-national-bank", "Punjab National Bank"), "/lender-logos/pnb-mark.png");
  assert.equal(officialLenderLogo("bank-of-baroda", "Bank of Baroda"), "/lender-logos/bank-of-baroda-mark.png");
  assert.equal(officialLenderLogo("state-bank-of-india", "State Bank of India"), "/lender-logos/sbi-mark.svg");
  assert.equal(officialLenderLogo("credila", "Credila", "NBFC"), "/lender-logos/credila-mark.png");
});

test("never exposes stored logo URLs and falls back to readable lender text", () => {
  assert.deepEqual(lenderLogoSources("credila", "HDFC Credila"), ["/lender-logos/credila-mark.png"]);
  assert.deepEqual(lenderLogoSources("axis-bank", "Axis Bank"), ["/lender-logos/axis-bank-mark.svg"]);
  assert.equal(lenderTextTileLabel("j-p-morgan", "J.P. Morgan Chase"), "J.P. Morgan");
  assert.equal(lenderTextTileLabel("new-international-lender", "A Very Long International Lender"), "A Very Long International Lender");
});
