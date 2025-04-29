import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const InputField = ({ placeholder, value, onChangeText, style, ...props }) => (
  <TextInput
    style={[styles.input, style]}
    placeholder={placeholder}
    placeholderTextColor={COLORS.textSecondary}
    value={value}
    onChangeText={onChangeText}
    {...props}
  />
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.md,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
});

export default InputField;
