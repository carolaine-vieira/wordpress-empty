const { registerBlockType } = wp.blocks;

import { __ } from '@wordpress/i18n';

import Edit from './edit';
import Save from './save';

registerBlockType('app/supporters', {
  title: __('Apoiadores', 'caboverde'),
  description: __('Exibe a lista de Apoiadores cadastrados', 'caboverde'),
  icon: 'shield-alt',
  category: 'theme',
  edit: props => <Edit {...props} />,
  save: props => <Save {...props} />,
});
