import chromadb
from chromadb.utils import embedding_functions
import os

from rag.cbt_data import cbt_documents

CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")

_collection = None

def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = client.get_or_create_collection(
            name="cbt_knowledge_base",
            embedding_function=embedding_fn
        )
    return _collection


def ingest_cbt_data():
    print("Starting CBT data ingestion...")
    collection = _get_collection()

    if collection.count() > 0:
        print(f"Knowledge base already has {collection.count()} documents. Skipping.")
        return collection

    collection.add(
        documents=cbt_documents,
        ids=[f"doc_{i}" for i in range(len(cbt_documents))]
    )
    print(f"Successfully ingested {collection.count()} CBT documents into ChromaDB!")
    return collection


def query_knowledge_base(query_text, n_results=2):
    collection = _get_collection()
    results = collection.query(query_texts=[query_text], n_results=n_results)
    return results["documents"][0]


if __name__ == "__main__":
    ingest_cbt_data()
