import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List
from sklearn.neural_network import MLPClassifier, MLPRegressor
import warnings

warnings.filterwarnings('ignore')

class DeepLearningError(Exception):
    """Custom exception for deep learning errors"""
    pass

class DeepLearningModels:
    """Deep learning and multi-layer neural network models"""
    
    @staticmethod
    def create_mlp_classifier(input_dim: int, output_dim: int = 2,
                             hidden_layers: List[int] = None) -> Any:
        """Create MLP classifier using scikit-learn or Keras"""
        try:
            from tensorflow.keras import Sequential
            from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
            from tensorflow.keras.optimizers import Adam
            
            if hidden_layers is None:
                hidden_layers = [128, 64, 32]
            
            model = Sequential()
            model.add(Dense(hidden_layers[0], activation='relu', input_dim=input_dim))
            model.add(BatchNormalization())
            model.add(Dropout(0.3))
            
            for units in hidden_layers[1:]:
                model.add(Dense(units, activation='relu'))
                model.add(BatchNormalization())
                model.add(Dropout(0.3))
            
            if output_dim == 2:
                model.add(Dense(1, activation='sigmoid'))
                loss = 'binary_crossentropy'
            else:
                model.add(Dense(output_dim, activation='softmax'))
                loss = 'categorical_crossentropy'
            
            model.compile(optimizer=Adam(learning_rate=0.001), loss=loss, metrics=['accuracy'])
            return model
        
        except ImportError:
            # Fallback to Scikit-Learn MLPClassifier when TensorFlow is not installed
            hidden_tuple = tuple(hidden_layers) if hidden_layers else (100, 50)
            return MLPClassifier(hidden_layer_sizes=hidden_tuple, max_iter=200, random_state=42)
        except Exception as e:
            raise DeepLearningError(f"Failed to create MLP classifier: {str(e)}")
    
    @staticmethod
    def create_mlp_regressor(input_dim: int, hidden_layers: List[int] = None) -> Any:
        """Create MLP regressor"""
        try:
            from tensorflow.keras import Sequential
            from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
            from tensorflow.keras.optimizers import Adam
            
            if hidden_layers is None:
                hidden_layers = [128, 64, 32]
            
            model = Sequential()
            model.add(Dense(hidden_layers[0], activation='relu', input_dim=input_dim))
            model.add(BatchNormalization())
            model.add(Dropout(0.3))
            
            for units in hidden_layers[1:]:
                model.add(Dense(units, activation='relu'))
                model.add(BatchNormalization())
                model.add(Dropout(0.3))
            
            model.add(Dense(1, activation='linear'))
            model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
            return model
        
        except ImportError:
            # Fallback to Scikit-Learn MLPRegressor
            hidden_tuple = tuple(hidden_layers) if hidden_layers else (100, 50)
            return MLPRegressor(hidden_layer_sizes=hidden_tuple, max_iter=200, random_state=42)
        except Exception as e:
            raise DeepLearningError(f"Failed to create MLP regressor: {str(e)}")

class DeepLearningTrainer:
    """Train neural network models"""
    
    def __init__(self, model, X_train: np.ndarray, y_train: np.ndarray,
                 X_val: np.ndarray = None, y_val: np.ndarray = None):
        self.model = model
        self.X_train = X_train
        self.y_train = y_train
        self.X_val = X_val
        self.y_val = y_val
        self.history = None
    
    def train(self, epochs: int = 50, batch_size: int = 32) -> Dict[str, Any]:
        """Train model with Keras or Scikit-learn fallback"""
        try:
            if hasattr(self.model, 'fit') and hasattr(self.model, 'compile'):
                # Keras model
                validation_data = (self.X_val, self.y_val) if self.X_val is not None else None
                self.history = self.model.fit(
                    self.X_train, self.y_train,
                    epochs=epochs,
                    batch_size=batch_size,
                    validation_data=validation_data,
                    verbose=0
                )
                return {
                    "status": "completed",
                    "epochs_trained": len(self.history.history['loss']),
                    "final_train_loss": float(self.history.history['loss'][-1])
                }
            else:
                # Scikit-learn MLP
                self.model.fit(self.X_train, self.y_train)
                return {
                    "status": "completed",
                    "epochs_trained": getattr(self.model, 'n_iter_', epochs),
                    "final_train_loss": float(getattr(self.model, 'loss_', 0.0))
                }
        
        except Exception as e:
            raise DeepLearningError(f"Training failed: {str(e)}")

def train_deep_learning_model(X_train: np.ndarray, y_train: np.ndarray,
                             X_test: np.ndarray = None, y_test: np.ndarray = None,
                             model_type: str = 'mlp',
                             task_type: str = 'classification',
                             epochs: int = 30) -> Dict[str, Any]:
    """Convenience function to train deep learning model"""
    try:
        input_dim = X_train.shape[1] if len(X_train.shape) > 1 else 1
        output_dim = len(np.unique(y_train)) if task_type == 'classification' else 1
        
        if task_type == 'classification':
            model = DeepLearningModels.create_mlp_classifier(input_dim, output_dim)
        else:
            model = DeepLearningModels.create_mlp_regressor(input_dim)
        
        trainer = DeepLearningTrainer(model, X_train, y_train)
        training_result = trainer.train(epochs=epochs)
        
        return {
            "model_type": model_type,
            "training_result": training_result
        }
    
    except Exception as e:
        raise DeepLearningError(f"Deep learning training failed: {str(e)}")
