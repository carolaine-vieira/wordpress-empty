const { useBlockProps } = wp.blockEditor;

export default () => {
  const blockProps = useBlockProps();

  return supporters?.length > 0 && (
    <div {...blockProps}>
      <ul className="supporters-list">
        <li className="supporters-list__item" key={logo.id + index}>
          <img className="supporters-list_item__image" src="https://via.placeholder.com/150x150/FFFFFF/000000?text=Support" />
        </li>
      </ul>
    </div>
  );
}
