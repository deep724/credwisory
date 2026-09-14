"use client";

import * as Select from "@radix-ui/react-select";
import { useState } from "react";
import styles from "./admin-filter-select.module.css";

type Option = { value: string; label: string };
type Props = { name: string; value?: string; placeholder: string; options: Option[]; ariaLabel: string };
const allValue = "__cw_all__";

/** Compact Radix Select that submits its selected value through the parent filter form. */
export function AdminFilterSelect({ name, value = "", placeholder, options, ariaLabel }: Props) {
  const [selected, setSelected] = useState(value);
  return <div className={styles.root}>
    <input type="hidden" name={name} value={selected} />
    <Select.Root value={selected || allValue} onValueChange={(next) => setSelected(next === allValue ? "" : next)}>
      <Select.Trigger className={styles.trigger} aria-label={ariaLabel}>
        <Select.Value />
        <Select.Icon className={styles.icon} aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={styles.content} position="popper" sideOffset={6} collisionPadding={12}>
          <Select.Viewport className={styles.viewport}>
            <Select.Item className={styles.item} value={allValue}><Select.ItemText>{placeholder}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item>
            {options.map((option) => <Select.Item key={option.value} className={styles.item} value={option.value}><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item>)}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>;
}
