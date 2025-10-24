const customFields = {
  cf_order_id: checkedId?.id || '',
  cf_issue_type: values?.zendesk_subissue_type,
  cf_product_name: selectedProductName,
  // cf_severity: 'Low',
  cf_material_code:
    selectedOrder?.product?.[selectedProductIndex]?.productDetails
      ?.material_code,
  cf_product_category796083:
    selectedOrder?.product?.[selectedProductIndex]?.productDetails
      ?.material_type,
  cf_product_subcategory:
    selectedOrder?.product?.[selectedProductIndex]?.productDetails
      ?.primary_category,
  cf_solution_provided: values?.zendesk_solution_provided || '',
};
