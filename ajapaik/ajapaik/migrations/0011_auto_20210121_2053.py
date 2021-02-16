# Generated by Django 2.2.17 on 2021-01-21 18:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ajapaik', '0010_muiscollection'),
    ]

    operations = [
        migrations.AddField(
            model_name='photo',
            name='muis_comment',
            field=models.TextField(blank=True, null=True, verbose_name='MUIS comment'),
        ),
        migrations.AddField(
            model_name='photo',
            name='muis_title',
            field=models.TextField(blank=True, null=True, verbose_name='MUIS title'),
        ),
        migrations.AddField(
            model_name='photo',
            name='muis_event_description_set_note',
            field=models.TextField(blank=True, null=True, verbose_name='MUIS event description set note'),
        ),
    ]
