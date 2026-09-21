import assert from "node:assert/strict";
import test from "node:test";
import { isGuidanceHref } from "../components/notification-permission-card";

test("Contact tab hashes never qualify as guidance-popup triggers", () => {
  assert.equal(isGuidanceHref("/contact#talk-to-expert"), false);
  assert.equal(isGuidanceHref("/contact#work-with-credwisory"), false);
  assert.equal(isGuidanceHref("/contact#submit-resume"), false);
  assert.equal(isGuidanceHref("/talk-to-an-expert"), false);
});

test("eligibility CTAs remain guidance-popup triggers", () => {
  assert.equal(isGuidanceHref("/eligibility"), true);
  assert.equal(isGuidanceHref("/eligibility?source=header"), true);
});
