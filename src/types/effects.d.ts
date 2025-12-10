export type Effect = {
  label: string;
  props: EffectProps;
};

export type EffectProps = {
  type: number | string;
  value: number | string;
  [key: string]: string | number;
};
