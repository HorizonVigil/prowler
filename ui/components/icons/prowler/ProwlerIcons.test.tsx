import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProwlerBrand } from "./ProwlerIcons";

describe("ProwlerBrand", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("should render the HorizonVigil lockups outside Cloud", () => {
    // Given
    vi.stubEnv("UI_CLOUD_ENABLED", "false");

    // When
    render(<ProwlerBrand />);

    // Then
    const logo = screen.getByRole("img", { name: "HorizonVigil" });
    const sources = Array.from(logo.querySelectorAll("img"), (image) =>
      image.getAttribute("src"),
    );

    expect(sources).toEqual([
      "/logos/horizonvigil-on-light.svg",
      "/logos/horizonvigil-on-dark.svg",
    ]);
  });

  it("should render the HorizonVigil lockups in Cloud", () => {
    // Given
    vi.stubEnv("UI_CLOUD_ENABLED", "true");

    // When
    render(<ProwlerBrand />);

    // Then
    const logo = screen.getByRole("img", { name: "HorizonVigil" });
    const sources = Array.from(logo.querySelectorAll("img"), (image) =>
      image.getAttribute("src"),
    );

    expect(sources).toEqual([
      "/logos/horizonvigil-on-light.svg",
      "/logos/horizonvigil-on-dark.svg",
    ]);
  });
});
