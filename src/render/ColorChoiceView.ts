import { COLORS } from "../schema/stimulus";

const labels = {
  red: "红色",
  green: "绿色",
  blue: "蓝色",
};

export function renderColorButtons(): string {
  return COLORS.map(
    (color) => `<button type="button" class="color-choice color-${color}" data-color="${color}">${labels[color]}</button>`
  ).join("");
}
