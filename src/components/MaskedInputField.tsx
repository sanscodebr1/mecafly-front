// components/MaskedInputField.tsx
import React from 'react';
import { KeyboardTypeOptions } from 'react-native';
import { InputField } from './InputField'; // <- o seu componente existente
import {
  MaskKind,
  unmask,
  maskCPF,
  maskCNPJ,
  maskCPForCNPJ,
  maskPhoneBR,
  limitRawByMask,
  maskRG,
  maskDate,
} from '../utils/masks';

type Props = Omit<React.ComponentProps<typeof InputField>, 'value' | 'onChangeText' | 'keyboardType' | 'maxLength'> & {
  mask: MaskKind;
  rawValue: string;                 // guardamos só dígitos no state da tela
  onChangeRaw: (raw: string) => void;
};

const getMaskedValue = (mask: MaskKind, raw: string) => {
  switch (mask) {
    case 'cpf': return maskCPF(raw);
    case 'cnpj': return maskCNPJ(raw);
    case 'cpfOrCnpj': return maskCPForCNPJ(raw);
    case 'phone': return maskPhoneBR(raw);
    case 'rg': return maskRG(raw);
    case 'date': return maskDate(raw); // ✅ novo
    default: return raw;
  }
};


const getKeyboardForMask = (mask: MaskKind): KeyboardTypeOptions =>
  mask === 'phone' ? 'phone-pad' : 'number-pad';

const getMaxLengthForMask = (mask: MaskKind) => {
  switch (mask) {
    case 'cpf': return 14;
    case 'cnpj': return 18;
    case 'cpfOrCnpj': return 18;
    case 'phone': return 15;
    case 'rg': return 13;
    case 'date': return 10; // dd/mm/yyyy
    default: return undefined;
  }
};

export const MaskedInputField: React.FC<Props> = ({
  mask,
  rawValue,
  onChangeRaw,
  ...rest
}) => {
  const maskedValue = getMaskedValue(mask, rawValue);
  const keyboardType = getKeyboardForMask(mask);
  const maxLength = getMaxLengthForMask(mask);

  const handleChangeText = (text: string) => {
    const limited = limitRawByMask(mask, text);
    onChangeRaw(limited);
  };

  return (
    <InputField
      {...rest}
      value={maskedValue}
      onChangeText={handleChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCorrect={false}
    />
  );
};
