'use client';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Select } from '@/components/ui/select';
import type { Messages } from '@/lib/i18n';
import { FieldFrame } from './field-frame';

/** A labelled select (Document 6, 8.4). The first option is an empty "Choose" unless the field always has a value. */
export function SelectField<TValues extends FieldValues>({
  form,
  name,
  id,
  label,
  description,
  optional,
  options,
  placeholder,
  messages,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
  options: readonly { value: string; label: string }[];
  /** Text of the empty first choice; leave out when the field always has a value. */
  placeholder?: string;
  messages: Messages;
}) {
  return (
    <FieldFrame form={form} name={name} id={id} label={label} description={description} optional={optional} messages={messages}>
      {({ invalid, describedBy }) => (
        <Select id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy} {...form.register(name)}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </FieldFrame>
  );
}
