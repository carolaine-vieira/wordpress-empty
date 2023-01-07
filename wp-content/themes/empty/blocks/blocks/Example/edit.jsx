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
                    content: __('Title', 'empty'),
                    textAlign: 'center',
                    level: 2,
                  },
                ],
                [
                  'core/paragraph',
                  {
                    content: __('Text example', 'empty')
                  },
                ],
              ]
            ]
          ]
        }
      />
    </div>
  );
}

export default SupportersEditor;
