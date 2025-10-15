import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let useModel: use.UniversalSentenceEncoder | null = null;

export const loadUSEModel = async () => {
  if (!useModel) useModel = await use.load();
};

export const isSemanticallyDuplicate = async (newReview: string, history: string[]): Promise<boolean> => {
  if (!history.length) return false;
  await loadUSEModel();
  const embeddings = await useModel!.embed([newReview, ...history]);
  const newVec = embeddings.slice([0, 0], [1]);
  const oldVecs = embeddings.slice([1]);
  const similarities = tf.matMul(newVec, oldVecs, false, true).arraySync()[0];
  return similarities.some((score: number) => score > 0.9);
};