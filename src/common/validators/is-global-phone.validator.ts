import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function IsGlobalPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsGlobalPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value || typeof value !== 'string') return false;

          const phone = parsePhoneNumberFromString(value);

          return phone ? phone.isValid() : false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid international phone number`;
        },
      },
    });
  };
}
