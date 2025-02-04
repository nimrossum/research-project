import { formatMsTime } from "./misc";
import { describe, expect, it } from "bun:test";

describe("formatMsTime", () => {
  it("should format ms", () => {
    expect(formatMsTime(100)).toBe("100.00ms");
    expect(formatMsTime(999)).toBe("999.00ms");
  });

  it("should format s", () => {
    expect(formatMsTime(1000)).toBe("1.00s");
    expect(formatMsTime(59 * 1000)).toBe("59.00s");
  });

  it("should format m", () => {
    expect(formatMsTime(60 * 1000)).toBe("1.00m");
    expect(formatMsTime(59 * 60 * 1000)).toBe("59.00m");
  });

  it("should format h", () => {
    expect(formatMsTime(60 * 60 * 1000)).toBe("1.00h");
    expect(formatMsTime(23 * 60 * 60 * 1000)).toBe("23.00h");
  });

  it("should format d", () => {
    expect(formatMsTime(24 * 60 * 60 * 1000)).toBe("1.00d");
  });
});
