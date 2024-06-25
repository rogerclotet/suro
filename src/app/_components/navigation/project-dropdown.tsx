"use client";

export default function ProjectDropdown() {
  return (
    <details className="dropdown">
      <summary>Projecte</summary>
      <ul tabIndex={0} className="menu mt-2 gap-2 pl-2">
        <li>
          <a href="#">Item 1</a>
        </li>
        <li>
          <a href="#">Item 2</a>
        </li>
        <li>
          <a href="#">Item 3</a>
        </li>
      </ul>
    </details>
  );
}
