import { ILayerLegend } from '../../../source/IExtended';
import { ImageWms } from '../../../source/ImageWms';

const states = new ImageWms({
  url: 'https://ahocevar.com/geoserver/wms',
  types: [{ id: 'topp:states' }],
  params: {},
});

test('fetchLegend wms', () => {
  return states.fetchLegend().then((response: Record<string, ILayerLegend[]>) => {
    expect<string>(response['topp:states'][0].srcImage).toEqual(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABQCAYAAACH+lLXAAAB20lEQVR42u3bS47CMAyAYY4xl+qaY86CA4YisRhV0zh27TzcH8lCotCIT83TyaOU8iD8AgRAFwLdyvbSBoiA3hd0f5W/cbxW+x2gAsoR9T/k2ufpQS1/HFBFFbaAtnyWDvQKoNQEAOqEKVV/qrwSE1Bjp2QdGjFsaniaNU8hoMyUAGW1CVBACUABBRRQwhF028eV2gAR0OVBR+eGepYbDjpDbugMNKLcIVW+J+jZKn5q0KhURm25L6rc7qA9c0PpQT1zQ1IqReqEolIo3UB754Y0K/7Lgc6QG0o1bJohN5QGlJkSoKw2AQooASiggBKA9t7btJWXNkAEFNB1zyktBjr/sZoAUK8DC4A6nE8akcJYssq34gLqCDoqJ5S2yo/KCaXvlHqnMG4zsAeUmRKgrDYBCigBKKCAEoCuAbq/fvZ4AukA+sX8/bwv96cDp6bhmLUVI0ANT6a0r/7WoJZq3gKqPWl3tkov5ZlqZUjlS/dXg1rbTMvJD2mxWDo4Fnl/F9ArHVDL06HJJXlf1+ayxFxXdG8+GszS5ISBegyNZge1XK/uF4geZ3q3oR5t4NX7VzdaRA/aW8ahmuveVdpy/2rZmWZAM4xnwXSeHBy/9ATz2j4DkFgPBfRW8QaUBZfdTH2h2gAAAABJRU5ErkJggg=='
    );
  });
});
