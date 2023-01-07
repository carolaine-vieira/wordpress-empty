const { InnerBlocks, useBlockProps } = wp.blockEditor;

import { __ } from '@wordpress/i18n';

const SupportersEditor = () => {
  const blockProps = useBlockProps();

  return (
    <div {...blockProps}>
      <InnerBlocks
        template={
          [
            [
              'core/group',
              {
                align: 'full',
                layout: {
                  type: 'flex',
                  orientation: 'vertical',
                  justifyContent: 'center',
                },
              },
              [
                [
                  'core/heading',
                  {
                    content: __('Apoio', 'caboverde'),
                    textColor: 'secondary',
                    level: 2,
                  },
                ],
                ['app/supporters-carousel']
              ]
            ]
          ]
        }
      />
    </div>
  );
}

export default SupportersEditor;
