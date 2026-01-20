
setup:
	python3make run -m venv .venv && \
	  source .venv/bin/activate && \
	  pip install -r requirements.txt

run:
	source .venv/bin/activate && ./model.py
