# -*- coding: utf-8 -*-
# Generated by Django 1.11.23 on 2019-09-29 13:51
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ajapaik_face_recognition', '0100_auto_20190929_1641'),
    ]

    operations = [
        migrations.AlterField(
            model_name='facerecognitionrectangle',
            name='age',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Young'), (1, 'Middleage'), (2, 'Old'), (3, 'Tundmatu'), (4, 'Not Applicable')], null=True),
        ),
        migrations.AlterField(
            model_name='facerecognitionrectangle',
            name='gender',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Mees'), (1, 'Naine'), (2, 'Tundmatu'), (3, 'Not Applicable')], null=True),
        ),
        migrations.AlterField(
            model_name='facerecognitionrectanglesubjectdataguess',
            name='age',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Young'), (1, 'Middleage'), (2, 'Old'), (3, 'Tundmatu'), (4, 'Not Applicable')], null=True),
        ),
        migrations.AlterField(
            model_name='facerecognitionrectanglesubjectdataguess',
            name='gender',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Mees'), (1, 'Naine'), (2, 'Tundmatu'), (3, 'Not Applicable')], null=True),
        ),
    ]
