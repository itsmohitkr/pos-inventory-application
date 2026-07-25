import { DialogContent } from '@mui/material';
import type { DialogContentProps } from '@mui/material';
import type React from 'react';

/**
 * `<DialogContent component="form" onSubmit={...}>` works at runtime — MUI
 * forwards `component` to the styled root — but DialogContent is not declared as
 * an OverridableComponent, so its props type rejects both `component` and the
 * form event handlers.
 *
 * This alias restores the typing without changing any runtime behaviour: it is
 * the same DialogContent, only described accurately.
 */
type FormDialogContentProps = DialogContentProps &
  React.FormHTMLAttributes<HTMLFormElement> & {
    component?: 'form';
  };

const FormDialogContent = DialogContent as React.ComponentType<FormDialogContentProps>;

export default FormDialogContent;
