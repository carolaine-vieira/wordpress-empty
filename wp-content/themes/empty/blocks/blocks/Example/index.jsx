const { registerBlockType } = wp.blocks;

import { __ } from '@wordpress/i18n';

import Edit from './edit';
import Save from './save';

registerBlockType('app/example-block', {
  title: __('Empty Theme Example Block', 'empty'),
  description: __('Display a example block', 'empty'),
  category: 'theme',
  edit: props => <Edit {...props} />,
  save: props => <Save {...props} />,
});
