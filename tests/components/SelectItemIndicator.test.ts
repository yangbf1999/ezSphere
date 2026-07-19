import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

describe("SelectItem indicator behavior", () => {
  it("marks the current option and updates the accessible value", async () => {
    render(
      React.createElement(
        Select,
        { defaultValue: "alpha" },
        React.createElement(
          SelectTrigger,
          { "aria-label": "Provider" },
          React.createElement(SelectValue),
        ),
        React.createElement(
          SelectContent,
          null,
          React.createElement(SelectItem, { value: "alpha" }, "Alpha"),
          React.createElement(SelectItem, { value: "beta" }, "Beta"),
        ),
      ),
    );

    const trigger = screen.getByRole("combobox", { name: "Provider" });
    expect(trigger).toHaveTextContent("Alpha");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const alpha = await screen.findByRole("option", { name: "Alpha" });
    const beta = screen.getByRole("option", { name: "Beta" });
    expect(alpha).toHaveAttribute("data-state", "checked");
    expect(beta).toHaveAttribute("data-state", "unchecked");
    expect(alpha.querySelector("svg")).toBeInTheDocument();

    fireEvent.click(beta);
    expect(trigger).toHaveTextContent("Beta");
  });
});
