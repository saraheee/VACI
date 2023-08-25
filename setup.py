import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="vaci",
    version="1",
    author="Sarah El-Sherbiny",
    author_email="sarah.el-sherbiny@tuwien.ac.at",
    description="Visual Analytics for the Integrated Exploration and Sensemaking of Cancer Cohort Radiogenomics and Clinical Information",
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)",
        "Operating System :: Microsoft :: Windows :: Linux :: Ubuntu",
    ],
    python_requires='>=3.8',
)
