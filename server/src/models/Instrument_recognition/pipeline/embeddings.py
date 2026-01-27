"""
Feature embeddings module
Extract intermediate representations from the model
"""

import logging
from typing import Dict

import numpy as np
import tensorflow as tf

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """Extract feature embeddings from intermediate layers"""

    def __init__(self, model: tf.keras.Model):
        """
        Initialize feature extractor

        Args:
            model: Trained Keras model
        """
        self.model = model
        self.embedding_models = {}
        logger.info("FeatureExtractor initialized")

    def create_embedding_model(self, layer_name: str) -> tf.keras.Model:
        """
        Create a model that outputs embeddings from a specific layer

        Args:
            layer_name: Name of the layer to extract features from

        Returns:
            Keras model for embedding extraction
        """
        try:
            # Find the layer
            layer = self.model.get_layer(layer_name)

            # Create embedding model
            embedding_model = tf.keras.Model(
                inputs=self.model.input, outputs=layer.output
            )

            self.embedding_models[layer_name] = embedding_model
            logger.info(f"Created embedding model for layer: {layer_name}")

            return embedding_model

        except Exception as e:
            logger.error(f"Failed to create embedding model: {e}")
            raise ValueError(
                f"Could not create embedding for layer '{layer_name}': {str(e)}"
            )

    def get_embeddings(
        self, features: np.ndarray, layer_name: str = None
    ) -> np.ndarray:
        """
        Extract embeddings from features

        Args:
            features: Input features
            layer_name: Layer to extract from (if None, uses last dense layer)

        Returns:
            Embedding vector
        """
        try:
            if layer_name is None:
                # Use the layer before output (typically last dense layer)
                layer_name = self._find_last_dense_layer()

            # Get or create embedding model
            if layer_name not in self.embedding_models:
                self.create_embedding_model(layer_name)

            embedding_model = self.embedding_models[layer_name]

            # Extract embeddings
            embeddings = embedding_model.predict(features, verbose=0)

            logger.info(
                f"Extracted embeddings from '{layer_name}': shape {embeddings.shape}"
            )
            return embeddings

        except Exception as e:
            logger.error(f"Failed to extract embeddings: {e}")
            raise RuntimeError(f"Embedding extraction failed: {str(e)}")

    def _find_last_dense_layer(self) -> str:
        """Find the name of the last dense layer before output"""
        dense_layers = [
            layer.name
            for layer in self.model.layers
            if isinstance(layer, tf.keras.layers.Dense)
        ]

        if len(dense_layers) < 2:
            raise ValueError("Model does not have enough dense layers")

        # Return second-to-last dense layer (last one is output)
        return dense_layers[-2]

    def get_available_layers(self) -> Dict[str, Dict]:
        """
        Get information about available layers for embedding extraction

        Returns:
            Dictionary of layer information
        """
        layers_info = {}

        for layer in self.model.layers:
            layers_info[layer.name] = {
                "type": layer.__class__.__name__,
                "output_shape": str(layer.output_shape),
                "trainable": layer.trainable,
            }

        return layers_info

    def extract_multi_layer_embeddings(
        self, features: np.ndarray, layer_names: list = None
    ) -> Dict[str, np.ndarray]:
        """
        Extract embeddings from multiple layers

        Args:
            features: Input features
            layer_names: List of layer names (if None, uses default layers)

        Returns:
            Dictionary mapping layer names to embeddings
        """
        if layer_names is None:
            # Default to CNN and LSTM layers
            layer_names = self._get_default_embedding_layers()

        embeddings = {}

        for layer_name in layer_names:
            try:
                emb = self.get_embeddings(features, layer_name)
                embeddings[layer_name] = emb
            except Exception as e:
                logger.warning(f"Could not extract from {layer_name}: {e}")
                continue

        logger.info(f"Extracted embeddings from {len(embeddings)} layers")
        return embeddings

    def _get_default_embedding_layers(self) -> list:
        """Get default layers for embedding extraction"""
        default_layers = []

        # Try to find common layer types
        for layer in self.model.layers:
            layer_type = layer.__class__.__name__

            # Include last layer of each type
            if layer_type in ["Conv2D", "LSTM", "Bidirectional", "Dense"]:
                default_layers.append(layer.name)

        # Keep only last few layers of each type
        return default_layers[-5:] if len(default_layers) > 5 else default_layers

    def compute_similarity(
        self, embedding1: np.ndarray, embedding2: np.ndarray
    ) -> float:
        """
        Compute cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Cosine similarity score (-1 to 1)
        """
        # Flatten embeddings
        emb1 = embedding1.flatten()
        emb2 = embedding2.flatten()

        # Compute cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)
        return float(similarity)
