import CtaSectionBlock from './blocks/CtaSectionBlock';
import CommerceReferenceBlock from './blocks/CommerceReferenceBlock';
import FallbackBlock from './blocks/FallbackBlock';
import FaqSectionBlock from './blocks/FaqSectionBlock';
import FeatureListBlock from './blocks/FeatureListBlock';
import HeroBlock from './blocks/HeroBlock';
import ImageBannerBlock from './blocks/ImageBannerBlock';
import RichTextBlock from './blocks/RichTextBlock';

const CMS_BLOCK_COMPONENTS = {
  hero: HeroBlock,
  rich_text: RichTextBlock,
  feature_list: FeatureListBlock,
  banner_group: ImageBannerBlock,
  image_banner: ImageBannerBlock,
  collection_teaser: CommerceReferenceBlock,
  product_reference_list: CommerceReferenceBlock,
  category_reference_list: CommerceReferenceBlock,
  faq_list: FaqSectionBlock,
  newsletter_cta: CtaSectionBlock,
  cta_section: CtaSectionBlock,
};

export function getCmsBlockComponent(sectionType) {
  return CMS_BLOCK_COMPONENTS[sectionType] || FallbackBlock;
}

export default CMS_BLOCK_COMPONENTS;
