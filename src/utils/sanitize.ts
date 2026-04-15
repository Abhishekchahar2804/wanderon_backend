import xss from 'xss';

export const sanitizeString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return xss(value.trim());
};

