export interface NkvProduct {
  name: string;
  articleNumber: string;
  price: number;
  unit: string;
  category: string;
}

export const nkvProducts: NkvProduct[] = [
  // Kulspetspennor
  { name: 'Kulspetspenna Ncon BP-83 metall blå fine', articleNumber: '41823', price: 49.80, unit: 'st', category: 'Pennor' },
  { name: 'Kulspetspenna Ncon BP-11JR jumbopatron', articleNumber: '641811', price: 29.90, unit: 'st', category: 'Pennor' },
  { name: 'Kulspetspenna Ncon BP-11 med clips', articleNumber: '641803', price: 32.20, unit: 'st', category: 'Pennor' },
  { name: 'Kulspetspenna Ncon LOBO Soft medium', articleNumber: '644202', price: 42.60, unit: 'st', category: 'Pennor' },
  { name: 'Kulspetspenna Ncon BP-26JR jumbopatron', articleNumber: '641911', price: 29.80, unit: 'st', category: 'Pennor' },
  { name: 'Kulspetspenna YOKA Grip TB162 0,7mm svart', articleNumber: '649271', price: 46.80, unit: 'st', category: 'Pennor' },

  // Blyertspennor
  { name: 'Blyertspenna Ncon gul HB 12-pack', articleNumber: '40135', price: 46.70, unit: 'ask', category: 'Pennor' },
  { name: 'Blyertspenna Ncon naturfärgad HB 12-pack', articleNumber: '40140', price: 21.00, unit: 'ask', category: 'Pennor' },
  { name: 'Blyertspenna Faber Castell naturfärgad B', articleNumber: '40119', price: 83.50, unit: 'ask', category: 'Pennor' },
  { name: 'Blyertspenna Faber Castell naturfärgad HB', articleNumber: '40120', price: 83.50, unit: 'ask', category: 'Pennor' },
  { name: 'Blyertspenna Faber Castell naturfärgad H', articleNumber: '40121', price: 83.50, unit: 'ask', category: 'Pennor' },
  { name: 'Blyertspenna gul med radertopp HB', articleNumber: '40105', price: 49.80, unit: 'ask', category: 'Pennor' },

  // Överstrykningspennor
  { name: 'Överstrykningspenna YOKA Dubbel 3 & 4mm', articleNumber: '663002', price: 39.70, unit: 'st', category: 'Pennor' },
  { name: 'Överstrykningspenna Pilot Frixion Light raderbar', articleNumber: '663950', price: 24.40, unit: 'st', category: 'Pennor' },
  { name: 'Överstrykningspenna YOKA Free-Ink', articleNumber: '663102', price: 32.50, unit: 'st', category: 'Pennor' },
  { name: 'Överstrykningspenna Stabilo Boss', articleNumber: '663501', price: 19.55, unit: 'st', category: 'Pennor' },
  { name: 'Överstrykningspenna Stabilo Boss 4-färgsset', articleNumber: '663514', price: 97.00, unit: 'frp', category: 'Pennor' },
  { name: 'Överstrykningspenna Stabilo Boss 8-färgsset', articleNumber: '663518', price: 184.00, unit: 'frp', category: 'Pennor' },
  { name: 'Överstrykningspenna Actual', articleNumber: '663801', price: 9.95, unit: 'st', category: 'Pennor' },

  // Whiteboardpennor
  { name: 'Whiteboardpenna Yoka Grip fine 3,0mm', articleNumber: '682502', price: 28.90, unit: 'st', category: 'Pennor' },
  { name: 'Whiteboardpenna Yoka Grip fine 3mm 4-färgsset', articleNumber: '682509', price: 125.00, unit: 'set', category: 'Pennor' },
  { name: 'Whiteboardpenna Yoka Grip broad 2-4,5mm', articleNumber: '682511', price: 28.90, unit: 'st', category: 'Pennor' },
  { name: 'Whiteboardpenna Yoka Grip broad 4-färgsset', articleNumber: '682519', price: 125.00, unit: 'set', category: 'Pennor' },
  { name: 'Whiteboardpenna Artline 517 fine svart', articleNumber: '682801', price: 27.80, unit: 'st', category: 'Pennor' },
  { name: 'Whiteboardpenna Artline 517 fine 4-färgsset', articleNumber: '682809', price: 119.00, unit: 'set', category: 'Pennor' },

  // Kopieringspapper
  { name: 'Kopieringspapper MultiCopy A4 80g ohålat', articleNumber: '157066', price: 83.50, unit: 'pkt', category: 'Papper' },
  { name: 'Kopieringspapper MultiCopy A4 80g hålslaget', articleNumber: '157068', price: 84.50, unit: 'pkt', category: 'Papper' },
  { name: 'Kopieringspapper MultiCopy A4 80g expressbox', articleNumber: '157056', price: 417.00, unit: 'box', category: 'Papper' },
  { name: 'Kopieringspapper MultiCopy A4 80g hålslaget expressbox', articleNumber: '157058', price: 421.00, unit: 'box', category: 'Papper' },
  { name: 'Kopieringspapper DataCopy A4 80g ohålat', articleNumber: '833513', price: 113.00, unit: 'pkt', category: 'Papper' },
  { name: 'Kopieringspapper DataCopy A4 80g hålslaget', articleNumber: '833514', price: 115.00, unit: 'pkt', category: 'Papper' },

  // Kontorstejp
  { name: 'Dokumenttejp NKV 19mm x 33m', articleNumber: '902903', price: 39.50, unit: 'rle', category: 'Tejp' },
  { name: 'Dokumenttejp NKV 19mm x 66m', articleNumber: '902901', price: 69.50, unit: 'rle', category: 'Tejp' },
  { name: 'Dokumenttejp Scotch Magic 3M-810 12mm x 33m', articleNumber: '74322', price: 45.20, unit: 'rle', category: 'Tejp' },
  { name: 'Dokumenttejp Scotch Magic 3M-810 19mm x 33m', articleNumber: '74320', price: 54.50, unit: 'rle', category: 'Tejp' },
  { name: 'Dokumenttejp Scotch Magic 3M-810 19mm x 66m', articleNumber: '74421', price: 116.00, unit: 'rle', category: 'Tejp' },
  { name: 'Dokumenttejp Scotch Magic 3M-900 miljö 19mm x 33m', articleNumber: '74325', price: 42.40, unit: 'rle', category: 'Tejp' },
  { name: 'Dokumenttejp Scotch Magic Dispenser+Tejp 19mm x 20m', articleNumber: '74326', price: 103.00, unit: 'st', category: 'Tejp' },

  // Packtejp
  { name: 'Packtejp PP 38mm x 66m transparent', articleNumber: '73238', price: 25.80, unit: 'rle', category: 'Tejp' },
  { name: 'Packtejp PP 38mm x 66m brun', articleNumber: '73138', price: 25.80, unit: 'rle', category: 'Tejp' },
  { name: 'Packtejp PP 50mm x 66m transparent', articleNumber: '73250', price: 28.80, unit: 'rle', category: 'Tejp' },
  { name: 'Packtejp PP 50mm x 66m brun', articleNumber: '73150', price: 28.80, unit: 'rle', category: 'Tejp' },

  // Häftapparater
  { name: 'Allroundset med diverse tillbehör', articleNumber: '292502', price: 1722.00, unit: 'st', category: 'Häftning' },
  { name: 'Häftapparat Novus B2 Miljö 24/6 och 26/6', articleNumber: '11879', price: 464.00, unit: 'st', category: 'Häftning' },
  { name: 'Häftapparat Novus B4FC flathäftning 24/6-8', articleNumber: '11885', price: 681.00, unit: 'st', category: 'Häftning' },
  { name: 'Häftapparat Novus B7A 24/6 och 26/6', articleNumber: '11883', price: 387.00, unit: 'st', category: 'Häftning' },
  { name: 'Häftapparat Novus B8FC flathäftning 24/8', articleNumber: '11880', price: 1212.00, unit: 'st', category: 'Häftning' },
  { name: 'Häftapparat Novus C1 24/6 och 26/6', articleNumber: '11890', price: 268.00, unit: 'st', category: 'Häftning' },
  { name: 'Häftapparat Novus C2 24/6 och 26/6', articleNumber: '11892', price: 302.00, unit: 'st', category: 'Häftning' },

  // Prisetiketter
  { name: 'Prisetikett Meto 22x12mm permanent vit', articleNumber: '25000', price: 42.00, unit: 'rle', category: 'Etiketter' },
  { name: 'Prisetikett Meto 22x12mm permanent röd', articleNumber: '25001', price: 42.00, unit: 'rle', category: 'Etiketter' },
  { name: 'Prisetikett Meto 26x12mm permanent vit', articleNumber: '25005', price: 42.00, unit: 'rle', category: 'Etiketter' },
  { name: 'Prisetikett Meto 26x16mm permanent röd', articleNumber: '25011', price: 42.00, unit: 'rle', category: 'Etiketter' },
  { name: 'Prisetikett Meto 29x28mm permanent röd', articleNumber: '25016', price: 61.00, unit: 'rle', category: 'Etiketter' },
  { name: 'Prisetikett Meto 32x19mm permanent vit', articleNumber: '25020', price: 61.00, unit: 'rle', category: 'Etiketter' },
];
