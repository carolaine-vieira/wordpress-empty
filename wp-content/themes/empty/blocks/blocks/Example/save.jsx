const { InnerBlocks, useBlockProps } = wp.blockEditor;

const SupportersSave = () => {
  const blockProps = useBlockProps.save();

  return (
    <div {...blockProps}>
      <InnerBlocks.Content />
    </div>
  );
}

export default SupportersSave;
