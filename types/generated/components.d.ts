import type { Schema, Attribute } from '@strapi/strapi';

export interface ButtonsButton extends Schema.Component {
  collectionName: 'components_buttons_buttons';
  info: {
    displayName: 'Button';
    icon: 'alien';
    description: '';
  };
  attributes: {
    label: Attribute.String;
    label2: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'buttons.button': ButtonsButton;
    }
  }
}
