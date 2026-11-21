import json
import sys
from html.parser import HTMLParser
from pathlib import Path


source = Path(sys.argv[1]).read_text()
lines = source.splitlines(keepends=True)
starts = [0]
for line in lines:
    starts.append(starts[-1] + len(line))


class Regions(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.raw = None
        self.comments = []
        self.scripts = []
        self.styles = []

    def position(self):
        line, column = self.getpos()
        return starts[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.raw = tag

    def handle_endtag(self, tag):
        if tag == self.raw:
            self.raw = None

    def handle_data(self, data):
        if self.raw == "script":
            self.scripts.append({"offset": self.position(), "source": data})
        elif self.raw == "style":
            self.styles.append({"offset": self.position(), "source": data})

    def handle_comment(self, data):
        self.comments.append(self.position())


parser = Regions()
parser.feed(source)
print(json.dumps({"comments": parser.comments, "scripts": parser.scripts, "styles": parser.styles}))
