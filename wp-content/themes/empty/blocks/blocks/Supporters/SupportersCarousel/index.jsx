const { registerBlockType } = wp.blocks;

import { __ } from '@wordpress/i18n';

import Edit from './edit';

registerBlockType('app/supporters-carousel', {
  title: __('Carrossel de Apoiadores', 'caboverde'),
  description: __('Exibe um carrossel com os Apoiadores cadastrados', 'caboverde'),
  icon: 'slides',
  category: 'theme',
  edit: props => <Edit {...props} />,
});
